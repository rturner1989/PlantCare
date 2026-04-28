# frozen_string_literal: true

module Api
  module V1
    module Spaces
      class ArchivesController < BaseController
        before_action :set_space

        def create
          @space.archive!
          render json: @space
        end

        def destroy
          @space.unarchive!
          render json: @space
        end

        private def set_space
          @space = current_user.spaces.find_by(id: params[:space_id])
          render json: { error: 'Not found' }, status: :not_found unless @space
        end
      end
    end
  end
end
