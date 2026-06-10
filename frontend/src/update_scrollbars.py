with open('x:/GitHub/Journal/frontend/src/index.css', 'a', encoding='utf-8') as f:
    f.write("""

/* Minimal Scrollbars */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border2);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-dim);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-dim);
}
""")
print("Scrollbar styles appended")
