import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketInstance = io(url);
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            console.log('Connected to signaling server');
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [url]);

    return socket;
};
