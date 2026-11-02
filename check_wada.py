import re
with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

for name in ['Yoshihiro Wada', 'Wai Kit Woo']:
    idx = text.find(name)
    print(name, 'found at', idx)
    if idx != -1:
        print(text[idx-50:idx+250])
