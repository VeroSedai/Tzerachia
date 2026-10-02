import { useCallback } from 'react';
import { AppState, Guide, Recipe } from '../types';
import { generateUUID } from '../utils/uuid';
import { supabase } from '../lib/supabase';
import {
  safeSetItem,
  CUSTOM_GUIDES_KEY,
  CUSTOM_RECIPES_KEY,
  CUSTOM_CATEGORIES_KEY,
} from '../services/storageService';

export const useGuidesAndRecipes = (
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const addCustomGuide = useCallback(
    async (guide: Guide) => {
      const newGuide = { ...guide, id: generateUUID() };
      const updatedGuides = [...state.customGuides, newGuide];

      // Pure React state update
      setState(prev => ({ ...prev, customGuides: updatedGuides }));

      // Side-effects outside setState
      try {
        await safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides);

        if (state.household && state.session) {
          const guidePayload = {
            id: newGuide.id,
            household_id: state.household.id,
            title: newGuide.title,
            category: newGuide.category,
            content:
              newGuide.content ||
              (Array.isArray(newGuide.steps)
                ? newGuide.steps
                    .map(s => (typeof s === 'string' ? s : s.description || s.text || ''))
                    .join('\n')
                : ''),
            created_by: state.session.user.id,
          };
          const { error } = await supabase.from('custom_guides').insert(guidePayload);
          if (error) console.error('[useGuidesAndRecipes] Error inserting custom guide on Supabase:', error);
        }
      } catch (err) {
        console.error('[useGuidesAndRecipes] Error in addCustomGuide:', err);
      }
    },
    [state.customGuides, state.household, state.session]
  );

  const addCustomRecipe = useCallback(
    async (recipe: Recipe) => {
      const newRecipe: Recipe = {
        ...recipe,
        id: generateUUID(),
      };
      const updatedRecipes = [...state.customRecipes, newRecipe];

      // Pure React state update
      setState(prev => ({ ...prev, customRecipes: updatedRecipes }));

      // Side-effects outside setState
      try {
        await safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes);

        if (state.household && state.session) {
          const recipePayload = {
            id: newRecipe.id,
            household_id: state.household.id,
            title: newRecipe.title,
            category: newRecipe.category,
            ingredients: newRecipe.ingredients,
            steps: newRecipe.steps,
            created_by: state.session.user.id,
          };
          const { error } = await supabase.from('custom_recipes').insert(recipePayload);
          if (error) console.error('[useGuidesAndRecipes] Error inserting custom recipe on Supabase:', error);
        }
      } catch (err) {
        console.error('[useGuidesAndRecipes] Error in addCustomRecipe:', err);
      }
    },
    [state.customRecipes, state.household, state.session]
  );

  const deleteCustomGuide = useCallback(
    async (id: string) => {
      const updatedGuides = state.customGuides.filter(g => g.id !== id);

      // Pure React state update
      setState(prev => ({ ...prev, customGuides: updatedGuides }));

      // Side-effects outside setState
      try {
        await safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides);

        if (state.household) {
          const { error } = await supabase.from('custom_guides').delete().eq('id', id);
          if (error) console.error('[useGuidesAndRecipes] Error deleting custom guide from Supabase:', error);
        }
      } catch (err) {
        console.error('[useGuidesAndRecipes] Error in deleteCustomGuide:', err);
      }
    },
    [state.customGuides, state.household]
  );

  const deleteCustomRecipe = useCallback(
    async (id: string) => {
      const updatedRecipes = state.customRecipes.filter(r => r.id !== id);

      // Pure React state update
      setState(prev => ({ ...prev, customRecipes: updatedRecipes }));

      // Side-effects outside setState
      try {
        await safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes);

        if (state.household) {
          const { error } = await supabase.from('custom_recipes').delete().eq('id', id);
          if (error) console.error('[useGuidesAndRecipes] Error deleting custom recipe from Supabase:', error);
        }
      } catch (err) {
        console.error('[useGuidesAndRecipes] Error in deleteCustomRecipe:', err);
      }
    },
    [state.customRecipes, state.household]
  );

  const addCustomCategory = useCallback(
    async (category: string) => {
      if (state.customCategories.includes(category)) return;
      const updatedCategories = [...state.customCategories, category];

      // Pure React state update
      setState(prev => ({ ...prev, customCategories: updatedCategories }));

      // Side-effects outside setState
      try {
        await safeSetItem(CUSTOM_CATEGORIES_KEY, updatedCategories);
      } catch (err) {
        console.error('[useGuidesAndRecipes] Error in addCustomCategory:', err);
      }
    },
    [state.customCategories]
  );

  const deleteCustomCategory = useCallback(
    async (category: string) => {
      const updatedCategories = state.customCategories.filter(c => c !== category);

      // Pure React state update
      setState(prev => ({ ...prev, customCategories: updatedCategories }));

      // Side-effects outside setState
      try {
        await safeSetItem(CUSTOM_CATEGORIES_KEY, updatedCategories);
      } catch (err) {
        console.error('[useGuidesAndRecipes] Error in deleteCustomCategory:', err);
      }
    },
    [state.customCategories]
  );

  return {
    addCustomGuide,
    addCustomRecipe,
    deleteCustomGuide,
    deleteCustomRecipe,
    addCustomCategory,
    deleteCustomCategory,
  };
};
