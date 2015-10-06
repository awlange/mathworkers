/*
 * Coordinator code for MathWorkersJS Node.js Boilerplate
 */

// Function to be called by the main code
var execute = function(MathWorkers, coord) {
  // Once the worker pool is ready, tell it to start the function tagged with "run"
  coord.onReady(function () {
    coord.trigger("run");
  });

  // Register an event listener for a message from the workers tagged "done"
  coord.on("done", function() {
    // Grab the message from the Coordinator buffer and print it to the console
    var messageList = coord.getMessageDataList();
    console.log(messageList);

    // Disconnect from the workers to end the program
    coord.disconnect();
  });
};

exports.execute = execute;
