/*
 * Coordinator code for MathWorkersJS HTML Boilerplate
 */

// Create the Coordinator with 2 MathWorkers (change as desired)
var coord = new MathWorkers.Coordinator(2, "js/work.js");

// Once the worker pool is ready, tell it to start the function tagged with "run"
coord.onReady(function() {
  coord.trigger("run");
});

// Register an event listener for a message from the workers tagged "done"
coord.on("done", function() {
  // Grab the message from the Coordinator buffer and print it to the console
  var messageList = coord.getMessageDataList();
  console.log(messageList);
});
