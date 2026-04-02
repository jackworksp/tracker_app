| Problem                | Without CDN                               | With CDN                          |
| ---------------------- | ----------------------------------------- | --------------------------------- |
| **Latency**            | User in Chennai hits server in Mumbai     | User hits edge server in Chennai  |
| **Origin server load** | Every request hits your server            | 99% of requests served from edge  |
| **Cost**               | You pay for every byte served from origin | Edge handles most traffic cheaply |
