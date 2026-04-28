# frozen_string_literal: true

class AddCategoryToSpaces < ActiveRecord::Migration[8.1]
  def change
    add_column :spaces, :category, :string, default: 'indoor', null: false
  end
end
