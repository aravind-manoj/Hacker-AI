import docker
import threading
import time
import socket
import re
import pyte

class Controller:
    def __init__(self, image="ubuntu:latest", tag=None):
        self.client = docker.from_env()
        self.image = image
        self.tag = tag
        self.container = None
        self.exec_id = None
        self.sock = None
        self.buffer = ""
        self.lock = threading.Lock()
        self.running = False

    def start(self):
        """Starts the container and the persistent shell session."""
        run_kwargs = {
            "image": self.image,
            "command": "tail -f /dev/null",
            "detach": True,
            "tty": True
        }
        if self.tag:
            run_kwargs["name"] = self.tag

        self.container = self.client.containers.run(**run_kwargs)

        exec_create = self.client.api.exec_create(
            self.container.id,
            cmd="/bin/bash",
            stdin=True,
            tty=True
        )
        self.exec_id = exec_create["Id"]

        self.sock = self.client.api.exec_start(
            self.exec_id,
            detach=False,
            tty=True,
            socket=True
        )

        self.running = True
        self.reader_thread = threading.Thread(target=self._read_stream)
        self.reader_thread.daemon = True
        self.reader_thread.start()
        self.db_thread = threading.Thread(target=self._sync_db)
        self.db_thread.daemon = True
        self.db_thread.start()

    def _read_stream(self):
        """Internal: Continuously reads raw bytes from the socket."""
        while self.running:
            try:
                data = self.sock._sock.recv(4096)
                if not data:
                    break
                
                decoded = data.decode('utf-8', errors='ignore')
                with self.lock:
                    self.buffer += decoded
            except socket.timeout:
                continue
            except Exception as e:
                if self.running: log_error(f"Error reading stream: {e}", agent_id=self.tag)
                break

    def _output_parser(self, buffer):
        screen = pyte.Screen(200, 50)
        stream = pyte.Stream(screen)
        stream.feed(buffer)
        display_lines = [line.rstrip() for line in screen.display]
        output = '\n'.join(display_lines).strip()
        return output

    def get_screen(self, last_chars=2000):
        """Returns the last N characters of the terminal output."""
        with self.lock:
            output = self._output_parser(self.buffer)
            if len(output) > last_chars:
                return f"... [Output truncated, showing last {last_chars} characters] ...\n{output[-last_chars:]}"
            return output

    def get_hostname(self):
        """Fetches the container's hostname by running a command inside."""
        marker = "HOSTNAME_MARKER"
        cmd = f"echo {marker}; hostname; echo {marker}"
        
        self.send_command(cmd)
        
        screen = self.get_screen(100)
        if marker in screen:
            try:
                result = screen.split(marker)[1].strip()
                return result
            except IndexError:
                return "Unknown"
        return "Unknown"
    
    def send_command(self, cmd):
        """Types a command and hits Enter."""
        cmd_bytes = (cmd + "\n").encode('utf-8')
        self.sock._sock.send(cmd_bytes)
        time.sleep(0.5)

    def send_keys(self, keys):
        """Types raw keys (useful for 'y', Ctrl+C, etc)."""
        self.sock._sock.send(keys.encode('utf-8'))

    def stop(self):
        """Clean up resources."""
        self.running = False
        if self.sock: self.sock.close()
        if self.container:
            self.container.stop()
            self.container.remove()