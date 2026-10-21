Dim src, tmp, prev, app, p, i, fso
src = WScript.Arguments(0) : prev = WScript.Arguments(1)
tmp = Replace(src, ".pptx", ".embedded.pptx")
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FolderExists(prev) Then fso.CreateFolder(prev)
Set app = CreateObject("PowerPoint.Application")
Set p = app.Presentations.Open(src, 0, 0, 0)
p.SaveAs tmp, 24, -1
For i = 1 To p.Slides.Count
  p.Slides(i).Export prev & "\slide-" & i & ".png", "PNG", 1600, 900
Next
WScript.Echo "slides: " & p.Slides.Count
p.Close
app.Quit
fso.CopyFile tmp, src, True
fso.DeleteFile tmp
WScript.Echo "size: " & fso.GetFile(src).Size
