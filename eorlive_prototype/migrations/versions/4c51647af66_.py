"""empty message

Revision ID: 4c51647af66
Revises: 199a9421576
Create Date: 2014-11-18 20:17:29.523444

"""

# revision identifiers, used by Alembic.
revision = '4c51647af66'
down_revision = '199a9421576'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('graph_data',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_on', sa.String(length=20), nullable=True),
    sa.Column('hours_scheduled', sa.Float(), nullable=True),
    sa.Column('hours_observed', sa.Float(), nullable=True),
    sa.Column('hours_with_data', sa.Float(), nullable=True),
    sa.Column('hours_with_uvfits', sa.Float(), nullable=True),
    sa.Column('data_transfer_rate', sa.Float(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('graph_data')
    ### end Alembic commands ###
