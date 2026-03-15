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

const fixWorkflow = inngest.createFunction(
  { id: "fix" },
  { event: "fix/start" },
  async ({ event, step }) => {
    const taskId = await step.run("publish-to-rabbitmq", async () => {
      const taskId = await publishToRabbitMQ({
        taskName: "worker.fix",
        args: [event.data.id, event.data.title, event.data.description, event.data.severity, event.data.vuln_id, event.data.systemId],
      });
      return taskId;
    })
    return taskId;
  },
);

const reportGenerateWorkflow = inngest.createFunction(
  { id: "report-generate" },
  { event: "report/generate" },
  async ({ event, step }) => {
    const taskId = await step.run("publish-to-rabbitmq", async () => {
      const taskId = await publishToRabbitMQ({
        taskName: "worker.report",
        args: [
          event.data.reportId,
          event.data.type,
          event.data.attackId,
          event.data.systemId,
          event.data.userId,
        ],
      });
      return taskId;
    });
    return taskId;
  }
);

export const functions = [attackWorkflow, fixWorkflow, reportGenerateWorkflow];
