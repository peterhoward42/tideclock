import { createContext } from 'svelte';
import type { TidePredictionsModel } from './tide-predictions.svelte';

export const [getTidePredictionsModel, setTidePredictionsModel] =
	createContext<TidePredictionsModel>();