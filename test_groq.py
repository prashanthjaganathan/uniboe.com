from groq import Groq
import os

# Load env
from dotenv import load_dotenv
load_dotenv('backend/.env')

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": "Say hello!"}],
    max_tokens=50
)

print(response.choices[0].message.content)
