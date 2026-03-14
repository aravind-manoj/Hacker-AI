import { inngest } from "./client";
import { publishToRabbitMQ } from "@/lib/rabbitmq";

const attackWorkflow = inngest.createFunction(
  { id: "attack" },
  { event: "attack/start" },
  async ({ event, step }) => {
    const taskId = await step.run("publish-to-rabbitmq", async () => {
      const taskId = await publishToRabbitMQ({
        taskName: "worker.attack",
        args: [event.data.attackId, event.data.targetList, event.data.attackVectors, event.data.note],
      });
      return taskId;
    })
    return taskId;
  },
);

export const functions = [attackWorkflow];