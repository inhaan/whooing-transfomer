import React, { useCallback } from 'react';

const FileUpload = ({ onFileSelect, accept = ".xlsx, .xls" }) => {
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('fileInput').click()}
        >
            <input
                type="file"
                id="fileInput"
                className="hidden"
                accept={accept}
                onChange={handleChange}
            />
            <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">Click or drag file to this area to upload</p>
                <p className="text-sm">Support for a single upload.</p>
            </div>
        </div>
    );
};

export default FileUpload;
