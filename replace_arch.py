import os

path = 'd:\\Projetos\\ann\\src\\components\\NetworkCanvas\\Flow.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'architecture'", "'build'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
