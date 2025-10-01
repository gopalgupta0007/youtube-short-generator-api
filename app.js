import OpenAI from "openai";

const openAI_Key="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"
const client= new OpenAI({apiKey:openAI_Key})

const response = await client.responses.create({
  input:"write a two different script for 30 Seconds video on Topic:kids study,\
                    Give me response in JSON format and follow the schema\
                    -{\
                    scripts:[\
                    {\
                    content:\
                    },\
                    ]\
                    }",
  model:"gpt-5o-mini"
});

console.log(response.output_text);