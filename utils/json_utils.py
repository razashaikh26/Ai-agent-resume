import json

def safe_parse_json(text):
    """
    Extract the first valid JSON object from LLM output.
    Ignores any extra text/tables after the JSON.
    """

    if not text:
        return None

    # Remove markdown fences
    text = text.replace("```json", "").replace("```", "")

    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    end = None

    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if end is None:
        return None

    json_text = text[start:end]

    try:
        return json.loads(json_text)
    except json.JSONDecodeError:
        return None