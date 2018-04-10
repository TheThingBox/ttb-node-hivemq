module.exports = function (RED) {
  "use strict";
  var mqtt = require('mqtt');

  function HiveMQNodeOUT(n) {
    RED.nodes.createNode(this, n);
    this.topic = n.topic;
    this.client = mqtt.connect("mqtt://broker.mqtt-dashboard.com:1883");
    var node = this;

    this.client.on("close", function() {
      node.status({ fill: "red", shape: "ring", text: "disconnected" });
    });
    this.client.on("connect", function() {
      node.status({ fill: "green", shape: "dot", text: "connected" });
    });

    this.on("input", function(msg) {
      var topic = msg.topic || node.topic;
      var value = msg.payload;
      var options = {
        qos: msg.qos || 0,
        retain: msg.retain || false
      };
      if (value === null || value === undefined) {
        value = "";
      } else if (!Buffer.isBuffer(value)) {
        if (typeof value === "object") {
          value = JSON.stringify(value);
        } else if (typeof value !== "string") {
          value = "" + value;
        }
      }
      node.client.publish(topic, value, options);
    });

    this.on("close", function() {
      if(node.client) {
        node.client.end();
      }
    });
  }
  RED.nodes.registerType("HiveMQ out",HiveMQNodeOUT);

  function HiveMQNodeIN(n) {
    RED.nodes.createNode(this,n);
    this.topic = n.topic;
    this.client = mqtt.connect("mqtt://broker.mqtt-dashboard.com:1883");
    var node = this;

    this.client.on("close", function() {
      node.status({ fill: "red", shape: "ring", text: "disconnected" });
    });

    this.client.on("connect", function() {
      node.status({ fill: "green", shape: "dot", text: "connected" });
      node.client.subscribe(node.topic)
    });

    this.client.subscribe(this.topic,2,function(topic,payload,qos,retain) {
      var msg = {topic:topic,payload:payload,qos:qos,retain:retain};
      node.send(msg);
    });

    this.client.on('message', function(topic, message) {
      node.send({
        topic: topic,
        payload: message.toString()
      });
    })

    this.on("close", function() {
      if(node.client) {
        node.client.end();
      }
    });
  }
  RED.nodes.registerType("HiveMQ in",HiveMQNodeIN);
}
