import os
import re

target_file = r'C:\Users\Tosito\Desktop\Tosito\paniculas\src\App.jsx'

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Delete movie inline (line 1506)
content = re.sub(
    r"const movieRef = doc\(db, 'artifacts', appId, 'movies', movie\.id\);\s*await deleteDoc\(movieRef\);",
    r"const token = localStorage.getItem('token');\n                                         await axios.delete(API_URL + '/movies/' + movie.id, { headers: { Authorization: `Bearer ${token}` } });",
    content
)

# 2. Promote user inline (line 1540)
content = re.sub(
    r"await setDoc\(doc\(db, 'artifacts', appId, 'users', u\.id\), \{ role: 'admin' \}, \{ merge: true \}\);",
    r"const token = localStorage.getItem('token');\n                                        await axios.put(API_URL + '/users/' + u.id + '/role', { role: 'admin' }, { headers: { Authorization: `Bearer ${token}` } });",
    content
)

# 3. Update metadata (genres)
content = re.sub(
    r"await setDoc\(doc\(db, 'artifacts', appId, 'public', 'metadata'\), \{ genres: updated \}, \{ merge: true \}\);",
    r"const token = localStorage.getItem('token');\n                                     await axios.put(API_URL + '/metadata', { genres: updated }, { headers: { Authorization: `Bearer ${token}` } });",
    content
)

# 4. Update metadata (categories)
content = re.sub(
    r"await setDoc\(doc\(db, 'artifacts', appId, 'public', 'metadata'\), \{ categories: updated \}, \{ merge: true \}\);",
    r"const token = localStorage.getItem('token');\n                                     await axios.put(API_URL + '/metadata', { categories: updated }, { headers: { Authorization: `Bearer ${token}` } });",
    content
)

# 5. Add new movie in handleSave
content = re.sub(
    r"await setDoc\(doc\(db, 'artifacts', appId, 'movies', id\), \{ \.\.\.newMovie, sources: finalSources, episodes: finalEpisodes, id \}\);",
    r"const token = localStorage.getItem('token');\n            await axios.post(API_URL + '/movies', { ...newMovie, sources: finalSources, episodes: finalEpisodes, id }, { headers: { Authorization: `Bearer ${token}` } });",
    content
)

# 6. Edit movie in handleSave
content = re.sub(
    r"await setDoc\(doc\(db, 'artifacts', appId, 'movies', editingMovie\.id\), \{ \.\.\.editingMovie, sources: finalSources, episodes: finalEpisodes \}, \{ merge: true \}\);",
    r"const token = localStorage.getItem('token');\n            await axios.put(API_URL + '/movies/' + editingMovie.id, { ...editingMovie, sources: finalSources, episodes: finalEpisodes }, { headers: { Authorization: `Bearer ${token}` } });",
    content
)

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Python refactoring of AdminView complete.")
