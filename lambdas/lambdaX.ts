import { Handler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({ region: process.env.REGION });
export const handler: Handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.Sns.Message);
      if (!snsMessage.email) {
        console.log("Missing email. Forwarding to QueueB...");
        await client.send(
          new SendMessageCommand({
            QueueUrl: process.env.QUEUE_B_URL!,
            MessageBody: JSON.stringify(snsMessage),
          })
        );
      } else {
        console.log("Email exists. Ignoring message.");
      }
    }
  } catch (error: any) {
    throw new Error(JSON.stringify(error));
  }
};
