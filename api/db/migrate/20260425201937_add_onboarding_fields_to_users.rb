# frozen_string_literal: true

class AddOnboardingFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :onboarding_intent, :string
    add_column :users, :onboarding_step_reached, :integer, default: 0, null: false
  end
end
