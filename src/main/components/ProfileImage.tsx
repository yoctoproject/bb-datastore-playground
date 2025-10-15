import {useGetUserQuery} from "../api/services/github";
import React from "react";

export const ProfileImage: React.FC = () => {
    const {data} = useGetUserQuery();

    return (<img src={data?.avatar_url || ""} alt="mdo" width="48" height="48"
                 className="rounded-circle"/>);
};