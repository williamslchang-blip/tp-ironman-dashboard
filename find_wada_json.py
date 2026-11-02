import re
import json

with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Let's search for Yoshihiro Wada in all JSON chunks
for m in re.finditer(r'\{[^{}]*?"fullName":"Yoshihiro Wada"[^{}]*?\}', html):
    print('Match:', m.group(0))

for m in re.finditer(r'\{[^{}]*?"fullName":"Wai Kit Woo"[^{}]*?\}', html):
    print('Match:', m.group(0))
