import json
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

bedrock = boto3.client(
    "bedrock-runtime",
    region_name="ap-south-1",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)


"""def call_llm(prompt):

    body = json.dumps({
        "prompt": prompt,
        "max_gen_len": 500,
        "temperature": 0.2
    })

    for _ in range(2):

        try:

            response = bedrock.invoke_model(
                modelId="meta.llama3-70b-instruct-v1:0",
                body=body
            )

            result = json.loads(response["body"].read())

            if isinstance(result, dict):
                return result.get("generation", "").strip()

            return ""

        except Exception as e:

            print("Bedrock error:", e)

    return "" """

def call_llm(prompt, temperature=0.2):

    body = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": [{"text": prompt}]
            }
        ],
        "inferenceConfig": {
            "maxTokens": 500,
            "temperature": temperature
        }
    })

    for _ in range(2):
        try:

            response = bedrock.invoke_model(
                modelId="arn:aws:bedrock:ap-south-1:030537971425:inference-profile/apac.amazon.nova-pro-v1:0",
                body=body,
                contentType="application/json",
                accept="application/json"
            )

            result = json.loads(response["body"].read())

            return result["output"]["message"]["content"][0]["text"].strip()

        except Exception as e:
            print("Bedrock error:", e)

    return ""