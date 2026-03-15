import threading
import time
import socket
import paramiko
import pyte
from logger import log_info, log_error
from db_manager import DBManager

class SSHController:
    def __init__(self, hostname, username, password=None, key_filename=None, port=22, tag=None):
        self.hostname = hostname
        self.username = username
        self.password = password
        self.key_filename = key_filename
        self.port = port
        self.tag = tag
        
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        self.channel = None
        self.buffer = ""
        self.lock = threading.Lock()
        self.running = False
        self.db = DBManager()
        self.last_saved_length = 0

    def start(self):
        """Connects to the SSH server and starts the persistent shell session."""
        log_info(f"Connecting to SSH ({self.username}@{self.hostname}:{self.port})", agent_id=self.tag)
        
        try:
            connect_kwargs = {
                "hostname": self.hostname,
                "port": self.port,
                "username": self.username,
            }
            if self.password:
                connect_kwargs["password"] = self.password
            if self.key_filename:
                connect_kwargs["key_filename"] = self.key_filename
                
            self.client.connect(**connect_kwargs)
            
            # Start an interactive shell session
            self.channel = self.client.invoke_shell(term='xterm')
            self.channel.settimeout(0.0) # non-blocking

            self.running = True
            self.reader_thread = threading.Thread(target=self._read_stream)
            self.reader_thread.daemon = True
            self.reader_thread.start()
            
            self.db_thread = threading.Thread(target=self._sync_db)
            self.db_thread.daemon = True
            self.db_thread.start()
            
            log_info("SSH Session started successfully", agent_id=self.tag)
        except Exception as e:
            log_error(f"Failed to start SSH session: {e}", agent_id=self.tag)
            self.running = False
            raise e

    def _read_stream(self):
        """Internal: Continuously reads raw bytes from the channel."""
        while self.running:
            try:
                if self.channel and self.channel.recv_ready():
                    data = self.channel.recv(4096)
                    if not data:
                        # Channel closed
                        log_info("SSH channel closed by server", agent_id=self.tag)
                        break
                    
                    decoded = data.decode('utf-8', errors='ignore')
                    with self.lock:
                        self.buffer += decoded
                else:
                    time.sleep(0.1)
                    
            except socket.timeout:
                continue
            except Exception as e:
                if self.running: 
                    log_error(f"Error reading SSH stream: {e}", agent_id=self.tag)
                break
                
        self.running = False
    
    def _sync_db(self):
        """Continuously monitors the buffer and syncs changes to DB."""
        while self.running:
            needs_update = False
            with self.lock:
                current_length = len(self.buffer)
                if current_length > self.last_saved_length:
                    buffer_snapshot = self.buffer
                    self.last_saved_length = current_length
                    needs_update = True

            if needs_update:
                try:
                    self.db.update_system_buffer(self.tag, buffer_snapshot)
                    log_info("Updating DB...", agent_id=self.tag)
                except Exception as e:
                    log_error(f"Failed to update DB: {e}", agent_id=self.tag)
            
            time.sleep(5)

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
            # We use the same pyte screen parser logic as before to handle ANSI escapes
            output = self._output_parser(self.buffer)
            if len(output) > last_chars:
                return f"... [Output truncated, showing last {last_chars} characters] ...\n{output[-last_chars:]}"
            return output

    def get_hostname(self):
        """Fetches the server's hostname by running a command inside."""
        marker = "HOSTNAME_MARKER"
        cmd = f"echo {marker}; hostname; echo {marker}"
        
        self.send_command(cmd)
        
        # Wait a moment for output to appear
        time.sleep(1)
        
        screen = self.get_screen(200)
        if marker in screen:
            try:
                parts = screen.split(marker)
                if len(parts) > 1:
                    result = parts[1].strip()
                    # filter any hidden characters if any
                    return result
            except Exception:
                pass
        return "Unknown"
    
    def send_command(self, cmd):
        """Types a command and hits Enter."""
        if self.channel and self.running:
            cmd_bytes = (cmd + "\n").encode('utf-8')
            self.channel.send(cmd_bytes)
            time.sleep(0.5)

    def send_keys(self, keys):
        """Types raw keys (useful for 'y', Ctrl+C, etc)."""
        if self.channel and self.running:
            self.channel.send(keys.encode('utf-8'))

    def stop(self):
        """Clean up resources."""
        self.running = False
        if self.channel: 
            self.channel.close()
        if self.client:
            self.client.close()
        log_info("SSH session stopped", agent_id=self.tag)
