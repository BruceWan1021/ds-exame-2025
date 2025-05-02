import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    const movieId = event.pathParameters?.movieId;
    const role = event.pathParameters?.role;
    const verbose = event.queryStringParameters?.verbose === "true";

    if (!movieId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing movieId" }),
      };
    }

    const parsedId = parseInt(movieId);

    if (verbose) {
      const query = new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "movieId = :mid",
        ExpressionAttributeValues: {
          ":mid": parsedId,
        },
      });
      const result = await client.send(query);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.Items),
      };
    } else {
      if (!role) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: "Missing role" }),
        };
      }

      const get = new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { movieId: parsedId, role },
      });
      const result = await client.send(get);

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: "Crew not found" }),
        };
      }

      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.Item),
      };
    }
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
}
