import axios from "axios";

async function getTTS() {
    const url = "https://api.streamelements.com/kappa/v2/speech";

    const params = {
        voice: "Brian",
        text: "Hello, what are you doing today?"
    };

    try {
        const res = await axios.get(url, {
            params,
            headers: {
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjaXRhZGVsIiwiZXhwIjoxNzc5OTk3NzUxLCJqdGkiOiI1OWE5YmM3My1jM2QyLTRmNjMtYTNhZi02OWJiZmYxZjBkMDciLCJjaGFubmVsIjoiNjkyYjRlMzc5MWI3ODdlOTAxNjc5NjQwIiwicm9sZSI6Im93bmVyIiwiYXV0aFRva2VuIjoiMlVsQ1VpVERHalU1Q29aZkFvTjlza1VPNk9yaVZ5bllyWWsyX2E2a1ZPT0UzcUFHIiwidXNlciI6IjY5MmI0ZTM3OTFiNzg3ZTkwMTY3OTYzZiIsInVzZXJfaWQiOiIwZjdiMzMzMC03NmMyLTQ1OTEtYmU5MS0yZTc0ZDUwN2M4YzciLCJ1c2VyX3JvbGUiOiJjcmVhdG9yIiwicHJvdmlkZXIiOiJraWNrIiwicHJvdmlkZXJfaWQiOiIzMzUwNDAzNCIsImNoYW5uZWxfaWQiOiIxNGJlZGIzMS0wMWEyLTRiNDctOTg2NC03YjdiNGMyMjEzMjgiLCJjcmVhdG9yX2lkIjoiYTc3YmI5NGUtZGQzYy00OWYxLWIyNjktMjMxNWQ1ZGQ4NjZkIn0.WBkSgDF36muhM8D-EKHYK5HViI_9lAp7mh9akNZ38y8"
            },
            responseType: "arraybuffer"
        });

        console.log("Success:", res.data);

    } catch (err) {
        console.log("Error:", err.response?.data || err.message);
    }
}

getTTS();
