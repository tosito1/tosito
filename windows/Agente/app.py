from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import sys
from main import WindowsAgent
import system_tools
import windows_mode
import dev_mode
import personal_mode
import game_mode

app = Flask(__name__, static_folder='static', template_folder='templates')
agent = WindowsAgent()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message')
    mode = data.get('mode', agent.mode)
    
    if mode != agent.mode:
        agent.set_mode(mode)
    
    # Dispatch based on mode
    if agent.mode == "windows":
        response = windows_mode.handle_windows_request(user_input, agent)
    elif agent.mode == "programming":
        response = dev_mode.handle_dev_request(user_input, agent)
    elif agent.mode == "personal":
        response = personal_mode.handle_personal_request(user_input, agent)
    elif agent.mode == "gaming":
        response = game_mode.handle_game_request(user_input, agent)
    else:
        response = agent.llm.chat([{'role': 'user', 'content': user_input}])
        
    return jsonify({
        "response": response,
        "mode": agent.mode
    })

@app.route('/api/stats', methods=['GET'])
def stats():
    try:
        data = system_tools.get_system_stats()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mode', methods=['POST'])
def set_mode():
    data = request.json
    mode = data.get('mode')
    res = agent.set_mode(mode)
    return jsonify({"message": res, "mode": agent.mode})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
