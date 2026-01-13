/*
  # Add DELETE policy for treatment_recommendations

  1. Changes
    - Add DELETE policy to allow users to delete their own treatment recommendations
  
  2. Security
    - Users can only delete their own recommendations (user_id match)
*/

-- Add DELETE policy for treatment_recommendations
CREATE POLICY "Users can delete own recommendations"
  ON treatment_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
