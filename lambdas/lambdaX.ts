import { Handler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({ region: process.env.REGION });

export const handler: Handler = async (event) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    for (const record of event.Records) {
      const message = JSON.parse(record.body); 

      const country = message.address?.country;
      const email = message.email;

      if (!email && (country === "Ireland" || country === "China")) {
        console.log("Missing email. Forwarding to QueueB...");

        await client.send(
          new SendMessageCommand({
            QueueUrl: process.env.QUEUE_B_URL!,
            MessageBody: JSON.stringify(message),
          })
        );
      } else {
        console.log("Email exists or country not allowed. Ignoring.");
      }
    }
  } catch (error: any) {
    console.error("Error:", error);
    throw new Error(JSON.stringify(error));
  }
};
