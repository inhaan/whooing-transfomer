import { useState } from 'react';
import FileUpload from './components/FileUpload';
import TextInput from './components/TextInput';
import { convertWoori, convertHana, convertCoupay } from './utils/converters';
import { writeExcel } from './utils/excel';

function App() {
    const [activeTab, setActiveTab] = useState('woori');
    const [file, setFile] = useState(null);
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setText('');
    };

    const handleTextChange = (newText) => {
        setText(newText);
        setFile(null);
    };

    const handleConvert = async () => {
        setIsProcessing(true);
        try {
            let data = [];
            if (activeTab === 'woori') {
                if (!file) throw new Error('Please select a file.');
                data = await convertWoori(file);
            } else if (activeTab === 'hana') {
                if (!file) throw new Error('Please select a file.');
                data = await convertHana(file);
            } else if (activeTab === 'coupay') {
                if (!text) throw new Error('Please enter text.');
                data = convertCoupay(text);
            }

            if (data.length === 0) {
                alert('No valid data found to convert.');
                return;
            }

            writeExcel(data, `whooing_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            alert('Conversion successful! File downloaded.');
        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'woori':
            case 'hana':
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm mb-4">
                            {activeTab === 'woori' ? 'Upload Woori Bank Excel file.' : 'Upload Hana Bank Excel file.'}
                        </div>
                        <FileUpload onFileSelect={handleFileSelect} />
                        {file && (
                            <div className="mt-2 text-sm text-gray-600">
                                Selected file: <span className="font-medium">{file.name}</span>
                            </div>
                        )}
                    </div>
                );
            case 'coupay':
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm mb-4">
                            Paste Coupay transaction text here.
                        </div>
                        <TextInput
                            value={text}
                            onChange={handleTextChange}
                            placeholder="Paste Coupay transaction text here..."
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Whooing Transformer
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Convert bank transactions to Whooing format
                    </p>
                </div>

                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        {['woori', 'hana', 'coupay'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setFile(null);
                                    setText('');
                                }}
                                className={`flex-1 py-4 px-6 text-center text-sm font-medium transition-colors duration-200 ${activeTab === tab
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'woori' && 'Woori Bank'}
                                {tab === 'hana' && 'Hana Bank'}
                                {tab === 'coupay' && 'Coupay'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {renderContent()}

                        <div className="mt-8">
                            <button
                                onClick={handleConvert}
                                disabled={isProcessing || (activeTab === 'coupay' ? !text : !file)}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ${isProcessing || (activeTab === 'coupay' ? !text : !file)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    }`}
                            >
                                {isProcessing ? 'Processing...' : 'Convert & Download'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
