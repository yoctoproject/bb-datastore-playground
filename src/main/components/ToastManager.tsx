import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {RootState} from "../api/store";
import {clearNotifications} from "../api/slices/notifications";

const ToastManager: React.FC = () => {
    const dispatch = useDispatch();
    const notifications = useSelector((state: RootState) => state.notifications.messages);

    useEffect(() => {
        notifications.forEach(({type, message}) => {
            toast[type](message, {
                position: "top-center"
            });
        });

        if (notifications.length > 0) {
            dispatch(clearNotifications());
        }
    }, [notifications, dispatch]);

    return <ToastContainer/>;
};

export default ToastManager;
