import { createContext, useContext } from 'react';

/** Opens the project dialog by project id, from anywhere on the page. */
export type OpenProject = (id: string) => void;

export const ProjectDialogContext = createContext<OpenProject>(() => {});

export const useOpenProject = () => useContext(ProjectDialogContext);
