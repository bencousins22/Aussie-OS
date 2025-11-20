import React, { useEffect, useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { fs } from '../services/fileSystem';

interface Props {
    filePath: string | null;
    language: string;
}

export const MonacoEditor: React.FC<Props> = ({ filePath, language }) => {
    const [content, setContent] = useState('');
    const editorRef = useRef<any>(null);

    useEffect(() => {
        if (filePath) {
            try {
                const c = fs.readFile(filePath);
                setContent(c);
            } catch (e) {
                setContent('// File not found');
            }
        } else {
            setContent('// Select a file to view content');
        }
    }, [filePath]);

    const handleEditorChange = (value: string | undefined) => {
        if (filePath && value !== undefined) {
            // Direct write to FS
            // In a real app, we might want 'unsaved' state, but for 'Real Deal' direct manipulation:
            fs.writeFile(filePath, value);
        }
    };

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        // Add Command S save support (optional since we auto-save above)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Visual feedback for save could go here
        });
    };

    if (!filePath) {
        return (
            <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500">
                <div className="text-center">
                    <div className="text-6xl mb-4 opacity-20">⌘</div>
                    <p>No file open</p>
                </div>
            </div>
        );
    }

    return (
        <Editor
            height="100%"
            language={language}
            value={content}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                wordWrap: 'on'
            }}
        />
    );
};
