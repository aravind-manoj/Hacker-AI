import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

interface TaskOptions {
  taskName: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

export async function publishToRabbitMQ({ taskName, args = [], kwargs = {} }: TaskOptions) {
  const RABBITMQ_URL = process.env.RABBITMQ_URL!;
  const QUEUE_NAME = 'celery';

  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    const taskId = uuidv4();
    const messageBody = JSON.stringify([args, kwargs, null]);

    const headers = {
      'task': taskName,
      'id': taskId,
      'lang': 'py',
      'argsrepr': JSON.stringify(args),
      'kwargsrepr': JSON.stringify(kwargs),
      'origin': 'gen@nextjs',
      'ignore_result': false
    };

    // 3. Publish
    channel.sendToQueue(QUEUE_NAME, Buffer.from(messageBody), {
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      deliveryMode: 2,
      priority: 0,
      correlationId: taskId,
      replyTo: undefined,
      headers: headers,
    });
    await channel.close();
    return taskId;
  } catch (error) {
    console.error('[RabbitMQ] Error publishing task:', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}