// Applies the system dark mode before first paint; the app takes over once settings load.
if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
