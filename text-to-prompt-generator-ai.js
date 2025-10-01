import OpenAI from "openai";
import express from 'express';
import dotenv from 'dotenv';


const app = express();
const port = 3000;

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: "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" });

app.get('/', async (req, res) => {
  try {

    const openAI_Key = "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"
    const client = new OpenAI({ apiKey: openAI_Key })

    const response = await client.responses.create({
      input: "write a two different script for 30 Seconds video on Topic:kids study,\
                    Give me response in JSON format and follow the schema\
                    -{\
                    scripts:[\
                    {\
                    content:\"\
                    },\
                    ]\
                    }",
      model: "gpt-4o-mini"
    });

    console.log(response.output_text);
    res.status(200).send(response.output_text);
  } catch (error) {
    console.error("Error generating content from OpenAI:", error);
    res.status(500).send("Error generating AI content.", error);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});









