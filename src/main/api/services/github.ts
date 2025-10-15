import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {Endpoints} from "@octokit/types";

type GetUserResponse = Endpoints["GET /user"]["response"]["data"];
type GetGistsResponse = Endpoints["GET /gists"]["response"]["data"];

export const githubApi = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://github-gist-proxy.laplante.io/',
        credentials: "include",
    }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getUser: builder.query<GetUserResponse, void>({
            query: () => 'user',
            providesTags: ['User'],
        }),
        getGists: builder.query<GetGistsResponse, void>({
            query: () => "list",
        }),
        logout: builder.mutation({
            query: () => ({
                url: 'logout',
                method: 'POST'
            }),
            invalidatesTags: ['User']
        }),
    }),
})

export const { useGetUserQuery, useGetGistsQuery, useLogoutMutation } = githubApi
