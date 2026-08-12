import { useCallback } from 'react';
import { AppState, Guide, Recipe } from '../types';
import { generateUUID } from '../utils/uuid';
import { supabase } from '../lib/supabase';
import { safeSetItem, CUSTOM_GUIDES_KEY, CUSTOM_RECIPES_KEY, CUSTOM_CATEGORIES_KEY } from '../services/storageService';

export const useGuidesAndRecipes = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {

  const addCustomGuide = useCallback(async (guide: Guide) => {
    setState(prev => {
      const newGuide = { ...guide, id: generateUUID() };
      const updatedGuides = [...prev.customGuides, newGuide];
      safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides).catch(console.error);
      
      if (prev.household && prev.session) {
        const guidePayload = {
          id: newGuide.id,
          household_id: prev.household.id,
          title: newGuide.title,
          category: newGuide.category,
          content: (newGuide as any).content || (Array.isArray(newGuide.steps) ? newGuide.steps.map((s: any) => s.description || s).join('\n') : ''),
          created_by: prev.session.user.id,
        };
        supabase.from('custom_guides').insert(guidePayload).then(({ error }) => {
          if (error) console.error(error);
        });
      }
      
      return { ...prev, customGuides: updatedGuides };
    });
  }, []);

  const addCustomRecipe = useCallback(async (recipe: Recipe) => {
    setState(prev => {
      const newRecipe = { 
        ...recipe, 
        id: generateUUID(),
        isCustom: true,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        steps: Array.isArray((recipe as any).steps) ? (recipe as any).steps : (typeof (recipe as any).steps === 'string' ? [(recipe as any).steps] : [])
      };
      const updatedRecipes = [...prev.customRecipes, newRecipe];
      safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes).catch(console.error);
      
      if (prev.household && prev.session) {
        const recipePayload = {
          id: newRecipe.id,
          household_id: prev.household.id,
          title: newRecipe.title,
          category: newRecipe.category,
          ingredients: newRecipe.ingredients,
          steps: (newRecipe as any).steps,
          created_by: prev.session.user.id,
        };
        supabase.from('custom_recipes').insert(recipePayload).then(({ error }) => {
          if (error) console.error(error);
        });
      }
      
      return { ...prev, customRecipes: updatedRecipes };
    });
  }, []);

  const deleteCustomGuide = useCallback(async (id: string) => {
    setState(prev => {
      if (prev.household) {
        supabase.from('custom_guides').delete().eq('id', id).then(({error}) => {
          if (error) console.error(error);
        });
      }
      const updatedGuides = prev.customGuides.filter(g => g.id !== id);
      safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides).catch(console.error);
      return { ...prev, customGuides: updatedGuides };
    });
  }, []);

  const deleteCustomRecipe = useCallback(async (id: string) => {
    setState(prev => {
      if (prev.household) {
        supabase.from('custom_recipes').delete().eq('id', id).then(({error}) => {
          if (error) console.error(error);
        });
      }
      const updatedRecipes = prev.customRecipes.filter(r => r.id !== id);
      safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes).catch(console.error);
      return { ...prev, customRecipes: updatedRecipes };
    });
  }, []);

  const addCustomCategory = useCallback(async (category: string) => {
    setState(prev => {
      if (prev.customCategories.includes(category)) return prev;
      const updatedCategories = [...prev.customCategories, category];
      safeSetItem(CUSTOM_CATEGORIES_KEY, updatedCategories).catch(console.error);
      return { ...prev, customCategories: updatedCategories };
    });
  }, []);

  const deleteCustomCategory = useCallback(async (category: string) => {
    setState(prev => {
      const updatedCategories = prev.customCategories.filter(c => c !== category);
      safeSetItem(CUSTOM_CATEGORIES_KEY, updatedCategories).catch(console.error);
      return { ...prev, customCategories: updatedCategories };
    });
  }, []);

  return {
    addCustomGuide,
    addCustomRecipe,
    deleteCustomGuide,
    deleteCustomRecipe,
    addCustomCategory,
    deleteCustomCategory
  };
};
