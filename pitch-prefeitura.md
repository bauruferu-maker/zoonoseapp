bash.exe: warning: could not find /tmp, please create!
Reading inline script metadata from `C:\Users\leoal\AppData\Local\Programs\@g4oselectron\resources\app\dist\resources\scripts\markitdown_cli.py`
Traceback (most recent call last):
  File "C:\Users\leoal\AppData\Local\Programs\@g4oselectron\resources\app\dist\resources\scripts/markitdown_cli.py", line 137, in <module>
    main()
  File "C:\Users\leoal\AppData\Local\uv\cache\archive-v0\3QJ9ZasPjdc5cqPZ9Gkmo\Lib\site-packages\click\core.py", line 1485, in __call__
    return self.main(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\leoal\AppData\Local\uv\cache\archive-v0\3QJ9ZasPjdc5cqPZ9Gkmo\Lib\site-packages\click\core.py", line 1406, in main
    rv = self.invoke(ctx)
         ^^^^^^^^^^^^^^^^
  File "C:\Users\leoal\AppData\Local\uv\cache\archive-v0\3QJ9ZasPjdc5cqPZ9Gkmo\Lib\site-packages\click\core.py", line 1269, in invoke
    return ctx.invoke(self.callback, **ctx.params)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\leoal\AppData\Local\uv\cache\archive-v0\3QJ9ZasPjdc5cqPZ9Gkmo\Lib\site-packages\click\core.py", line 824, in invoke
    return callback(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\leoal\AppData\Local\Programs\@g4oselectron\resources\app\dist\resources\scripts/markitdown_cli.py", line 108, in main
    write_output(text, output)
  File "C:\Users\leoal\AppData\Local\Programs\@g4oselectron\resources\app\dist\resources\scripts/markitdown_cli.py", line 84, in write_output
    click.echo(text)
  File "C:\Users\leoal\AppData\Local\uv\cache\archive-v0\3QJ9ZasPjdc5cqPZ9Gkmo\Lib\site-packages\click\utils.py", line 321, in echo
    file.write(out)  # type: ignore
    ^^^^^^^^^^^^^^^
  File "C:\Users\leoal\AppData\Roaming\uv\python\cpython-3.12.8-windows-x86_64-none\Lib\encodings\cp1252.py", line 19, in encode
    return codecs.charmap_encode(input,self.errors,encoding_table)[0]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
UnicodeEncodeError: 'charmap' codec can't encode character '\u2192' in position 4606: character maps to <undefined>
