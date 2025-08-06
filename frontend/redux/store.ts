import { configureStore } from '@reduxjs/toolkit'
import projectsReducer from './projectsSlice'
import videoEditorReducer from './videoEditorSlice'

export const store = configureStore({
    reducer: {
        projects: projectsReducer,
        videoEditor: videoEditorReducer
    }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store