import https from "https";
import http from "http";

export default url => {
  const httpService = url.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    httpService
      .get(url, res => {
        res.setEncoding("utf-8");

        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
};
