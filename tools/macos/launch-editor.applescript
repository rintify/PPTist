on run
	try
		set resourceDir to (POSIX path of (path to me)) & "Contents/Resources/"
		set repoPath to do shell script "/bin/cat " & quoted form of (resourceDir & "repo-path")
		do shell script "/bin/bash " & quoted form of (resourceDir & "start-editor.sh") & " " & quoted form of repoPath
		openEditor()
	on error errorMessage number errorNumber
		if errorNumber is -1743 then
			set errorMessage to "システム設定 → プライバシーとセキュリティ → オートメーションで、このアプリから Google Chrome の操作を許可してください。"
		end if
		display alert "スライド編集を開けませんでした" message errorMessage
	end try
end run

on openEditor()
	set editorURL to "http://127.0.0.1:5173/"
	tell application "Google Chrome"
		launch
		repeat with editorWindow in windows
			set tabNumber to 0
			repeat with editorTab in tabs of editorWindow
				set tabNumber to tabNumber + 1
				set tabURL to URL of editorTab
				if tabURL is editorURL or tabURL is "http://localhost:5173/" then
					set active tab index of editorWindow to tabNumber
					set index of editorWindow to 1
					activate
					return
				end if
			end repeat
		end repeat
		if (count windows) is 0 then
			make new window
			set URL of active tab of front window to editorURL
		else
			tell front window to make new tab with properties {URL:editorURL}
		end if
		activate
	end tell
end openEditor
