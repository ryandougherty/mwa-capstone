"""empty message

Revision ID: 37b71b6dfa31
Revises: 101c4a826ed0
Create Date: 2015-02-20 17:05:17.270336

"""

# revision identifiers, used by Alembic.
revision = '37b71b6dfa31'
down_revision = '101c4a826ed0'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('set',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=32), nullable=True),
    sa.Column('name', sa.String(length=50), nullable=True),
    sa.Column('start', sa.Integer(), nullable=True),
    sa.Column('end', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['username'], ['user.username'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('flagged_subset',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('set_id', sa.Integer(), nullable=True),
    sa.Column('start', sa.Integer(), nullable=True),
    sa.Column('end', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['set_id'], ['set.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('set_subscriptions',
    sa.Column('username', sa.String(length=32), nullable=True),
    sa.Column('set_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['set_id'], ['set.id'], ),
    sa.ForeignKeyConstraint(['username'], ['user.username'], )
    )
    op.create_table('flagged_obs_ids',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('flagged_subset_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['flagged_subset_id'], ['flagged_subset.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
<<<<<<< HEAD
    op.drop_table('comment')
=======
>>>>>>> heroku-set-construction
    op.drop_table('user_range')
    op.drop_table('range')
    op.drop_table('histogram_data')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user_range',
    sa.Column('user', sa.VARCHAR(length=32), autoincrement=False, nullable=True),
    sa.Column('range_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['range_id'], [u'range.id'], name=u'user_range_range_id_fkey'),
    sa.ForeignKeyConstraint(['user'], [u'user.username'], name=u'user_range_user_fkey')
    )
    op.create_table('histogram_data',
    sa.Column('obs_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('julian_day', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('obs_id', name=u'histogram_data_pkey')
    )
    op.create_table('range',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('start', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('end', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name=u'range_pkey')
    )
    op.drop_table('flagged_obs_ids')
    op.drop_table('set_subscriptions')
    op.drop_table('flagged_subset')
    op.drop_table('set')
    ### end Alembic commands ###
