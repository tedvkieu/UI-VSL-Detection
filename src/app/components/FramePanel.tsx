interface ResultPanelProps {
    result: string;
    label: string;
    // framesData: number[][];
}

export default function FramePanel({ result }: ResultPanelProps) {
    console.log('ResultPanel nhận được kết quả: ', result);

    return (
        <>
            <h2 className="text-2xl text-gray-500 font-semibold mb-4">
                Thông tin Thu Thập Frame
            </h2>
            <div className="bg-white shadow-md rounded-lg p-6 text-lg min-h-[64px] flex items-center text-gray-500">
                {result ? (
                    <span className="text-gray-400 italic ">{result}</span>
                ) : (
                    <span className="italic text-gray-400">
                        Đang chờ kết quả...
                    </span>
                )}
            </div>
        </>
    );
}
