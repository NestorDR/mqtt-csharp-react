using System;
using System.Text;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace csharp_mqtt_publisher
{
    class Program
    {
        static void Main()
        {
            const int INDEX_PROVIDER = 0;
            const int INDEX_RESOURCE = 1;
            const bool NO_RETAINED = false;

            int[,] arrayProvidersResources =  { { 18678, 427 }, { 18678, 1439 }, { 8424, 553 }, { 8424, 558 } };
            var totalPairs = arrayProvidersResources.GetLength(0);

            try
            {
                // Connect to MQTT Broker - Client uses by default: TCP protocol and ports 1883 or 8883 (for TLS / SSL)
                var mqttClient = new MqttClient("PUT_YOUR_SERVER_HERE");
                mqttClient.MqttMsgPublished += new MqttEventsHandler().MqttMsgPublished;

                var clientId = "csharp_publisher_" + Guid.NewGuid();
                mqttClient.Connect(clientId);

                if (mqttClient.IsConnected)
                {
                    var i = 0;
                    string repeat;
                    do
                    {
                        if (!mqttClient.IsConnected) break;

                        var topic = "st/p{0}/r{1}";
                        var selectedPair = i % totalPairs;
                        topic = string.Format(topic, arrayProvidersResources[selectedPair, INDEX_PROVIDER],
                            arrayProvidersResources[selectedPair, INDEX_RESOURCE]);

                        var stringMessage = $"{++i}º Hello World from C#. DateTime: {DateTime.Now}";
                        var byteArrayMessage = Encoding.UTF8.GetBytes(stringMessage);

                        ushort msgId = mqttClient.Publish(
                            topic, // Topic where publish
                            byteArrayMessage, // Message to publish
                            MqttMsgBase.QOS_LEVEL_AT_LEAST_ONCE, // QoS level 1
                            NO_RETAINED); // retained
                        Console.WriteLine($"Topic {topic}  |  Message ID {msgId}\nMessage: {stringMessage}");

                        Console.WriteLine("Enter 'N' to exit");
                        repeat = Console.ReadLine();

                    } while (repeat.ToUpper() != "N");

                    if (mqttClient.IsConnected)
                    {
                        // Disconnect from MQTT Broker
                        mqttClient.Disconnect();
                    }
                }
                else
                {
                    Console.WriteLine("Conexión no establecida.");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                // throw;
            }
        }
    }

    class MqttEventsHandler
    {
        public void MqttMsgPublished(object sender, MqttMsgPublishedEventArgs e)
        {
            Console.WriteLine("MessageId = " + e.MessageId + " Published = " + e.IsPublished);
        }
    }
}
