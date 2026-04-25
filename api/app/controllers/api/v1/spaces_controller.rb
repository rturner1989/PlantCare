# frozen_string_literal: true

module Api
  module V1
    class SpacesController < BaseController
      before_action :set_space, only: [:show, :update, :destroy]

      def index
        render json: current_user.spaces
      end

      def show
        render json: @space
      end

      def create
        space = current_user.spaces.new(space_params)
        if space.save
          render json: space, status: :created
        else
          render json: { errors: space.errors.messages }, status: :unprocessable_content
        end
      end

      def update
        if @space.update(space_params)
          render json: @space
        else
          render json: { errors: @space.errors.messages }, status: :unprocessable_content
        end
      end

      def destroy
        @space.destroy!
        head :no_content
      end

      private def set_space
        @space = current_user.spaces.find_by(id: params[:id])
        render json: { error: 'Not found' }, status: :not_found unless @space
      end

      private def space_params
        params.expect(space: [:name, :icon])
      end
    end
  end
end
