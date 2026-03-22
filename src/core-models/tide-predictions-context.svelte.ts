import { createContext } from 'svelte';
import type { TidePredictionsModel } from './tide-predictions';

export const [getTidePredictionsModel, setTidePredictionsModel] =
	createContext<TidePredictionsModel>();