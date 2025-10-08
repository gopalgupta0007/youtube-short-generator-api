// file: generate.js
import fetch from 'node-fetch';   // omit on Node >=18

const MODEL = 'hf.co/tensorblock/gpt2-xl_lima-GGUF:latest';   // the name you saw in `ollama list`
const PROMPT = `write a two different script for 30 Seconds video on Topic: tom and jerry story,\
                    Give me response in JSON format and follow the schema\
                    -{\
                    scripts:[\
                    {\
                    content:\"
                    \",\
                    },\
                    ]\
                    }`;

async function generate() {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            prompt: PROMPT,
            stream: false,            // true → streaming chunks (see below)
            temperature: 0.7,
            max_tokens: 200,
            // top_p, top_k, stop, etc. can be added here
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${err}`);
    }

    const data = await response.json();   // { model, created_at, response, done, ... }
    console.log('💬 Model answer:\n', data.response);
}

generate().catch(console.error);
