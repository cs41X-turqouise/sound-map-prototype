import React from 'react';

function UploadModal({ isOpen, onClose, onUpload }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="upload-modal">
            <div className="modal-content">
                <h2>Upload MP3</h2>
                <input type="file" accept="audio/mp3" onChange={onUpload} />
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default UploadModal;
