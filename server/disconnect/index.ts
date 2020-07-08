import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  context.log("In connect");

  let userId = req.body && req.body.userId;
  if (!userId) {
    context.res = {
      status: 500,
      body: "You did not include a user ID",
    };
  }

  const roomName = "kitchen";

  context.res = {
    status: 200,
  };

  context.bindings.signalRGroupActions = [
    {
      userId,
      groupName: "users",
      action: "remove",
    },
    {
      userId,
      groupName: roomName,
      action: "remove",
    },
  ];

  console.log("Setting messages");

  context.bindings.signalRMessages = [
    {
      groupName: roomName,
      target: "playerDisconnected",
      arguments: [userId],
    },
  ];
};

export default httpTrigger;
